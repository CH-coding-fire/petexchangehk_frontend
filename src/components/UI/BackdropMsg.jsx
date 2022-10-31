import React from 'react'

/*BackdropMsg is for showing it serves to display message according to the condition of the info of animal*/

function backdropMsg(props) {
	const { animal,index,user,updateAnimalHandler } = props;
  return (
    <div className="backdrop align-items-baseline h-100 w-100 ">
								<div className='fs-1 fw-bold m-5' >
									{animal.shadow && animal.shadow.option === "updateAvail" &&
									<div>
												<p className='h-100 m-4 text-warning '>暫停開放</p>
												{(animal.creator) ? (user.nickname === animal.creator.nickname &&
													<p onClick={() =>
														updateAnimalHandler({ index: index, option: 'updateAvail', avail: true })
													} className='h-100 m-4 reopen'>按此重新開放</p>):<p></p>
												}
										</div>}
									{animal.shadow && animal.shadow.option === "updateSuccess" &&
									<div>
										<p className='h-100 m-4 text-info '>已完成交易/領養</p>
										</div>}
								</div>
							</div>
  )
}
export default backdropMsg